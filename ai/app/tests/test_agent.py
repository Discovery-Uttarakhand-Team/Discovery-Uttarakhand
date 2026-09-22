import pytest
import asyncio
from app.tools.route import plan_route
from app.agent.planner import plan_tools, analyze_slots
from app.agent.graph import AGENT_GRAPH

@pytest.mark.asyncio
async def test_route_haldwani_to_nainital_not_350km():
    """Validates that Haldwani to Nainital uses real road distance (~40-55km), not Delhi 350km."""
    res = await plan_route("Haldwani", "Nainital")
    assert res["success"] is True
    data = res["data"]
    assert data["routeAvailable"] is True
    dist = data["estimatedDistanceKm"]
    assert 30.0 <= dist <= 65.0, f"Distance was {dist}km, expected ~40-55km, NOT 350km!"
    assert data["estimatedDurationHours"] <= 2.5

@pytest.mark.asyncio
async def test_route_same_place():
    res = await plan_route("Nainital", "Nainital")
    assert res["success"] is True
    assert res["data"]["estimatedDistanceKm"] == 0

def test_missing_slots_analysis():
    intents = ["TRIP_PLANNING"]
    state = {"destination": "Nainital"}
    missing = analyze_slots(intents, state)
    assert "origin" in missing
    assert "duration_days" in missing

def test_planner_does_not_plan_premature_route_without_origin():
    """If user says 'mujhe Nainital jana hai' without origin, route tool must NOT be planned with fake Delhi origin."""
    intents = ["TRIP_PLANNING"]
    state = {"destination": "Nainital"}
    tools = plan_tools(intents, state)
    assert not any(t["name"] == "planRoute" for t in tools), "planRoute should not be planned without origin!"
    assert not any(t["name"] == "calculateBudget" for t in tools), "calculateBudget should not be planned without duration!"

def test_planner_plans_tools_when_slots_present():
    intents = ["TRIP_PLANNING"]
    state = {"destination": "Nainital", "origin": "Haldwani", "duration_days": 3}
    tools = plan_tools(intents, state)
    tool_names = [t["name"] for t in tools]
    assert "planRoute" in tool_names
    assert "findStays" in tool_names
    assert "calculateBudget" in tool_names

@pytest.mark.asyncio
async def test_graph_nainital_greeting_and_chips():
    result = await AGENT_GRAPH.ainvoke(
        {"user_message": "mujhe Nainital jana hai"},
        {"configurable": {"thread_id": "test_thread_nainital"}}
    )
    resp = result.get("final_response", "")
    assert len(resp) > 10
    chips = result.get("suggested_actions", [])
    assert len(chips) > 0
    labels = [c.get("label") for c in chips]
    # Kumaon destination should offer Haldwani gateway chip
    assert any("Haldwani" in l for l in labels)
